
import { User, Application, Score, PortalSettings } from '../types';
import { DEMO_USERS, DEMO_APPS, SCORING_CRITERIA } from '../constants';

// --- CONFIGURATION ---
// 1. SET THIS TO FALSE to use Real Firebase
// 2. PASTE YOUR KEYS below in firebaseConfig
export const USE_DEMO_MODE = true; 

// --- REAL FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile as fbUpdateProfile, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, writeBatch } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBH4fnIKGK4zyY754ahI5NBiayBCcAU7UU",
  authDomain: "pb-portal-2026.firebaseapp.com",
  projectId: "pb-portal-2026",
  storageBucket: "pb-portal-2026.firebasestorage.app",
  messagingSenderId: "810167292126",
  appId: "1:810167292126:web:91128e5a8c67e4b6fb324f",
  measurementId: "G-9L1GX3J9H7"
};

// Initialize Firebase (Conditional)
const app = !USE_DEMO_MODE = false initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

const DEFAULT_SETTINGS: PortalSettings = {
    stage1Visible: true,
    stage2Visible: false,
    votingOpen: false
};

/**
 * BULK UPLOAD SCRIPT
 * This function takes the data from constants.ts and uploads it to Firestore.
 * It maps the data to the collection structure defined in your requirements.
 */
export const seedDatabase = async () => {
    if (USE_DEMO_MODE || !db) {
        throw new Error("Cannot seed in Demo Mode. Set USE_DEMO_MODE to false and add API keys.");
    }

    console.log("Starting Seed...");
    const batch = writeBatch(db);

    // 1. Seed Users (Firestore Profiles)
    // Note: This does NOT create Auth accounts (email/password). 
    // You must create Auth accounts manually or via Admin SDK to match these UIDs, 
    // OR just use this for data visualization.
    DEMO_USERS.forEach(user => {
        // Remove password from the doc we save to db
        const { password, ...userData } = user; 
        const userRef = doc(db, "users", user.uid);
        batch.set(userRef, userData);
    });

    // 2. Seed Applications
    DEMO_APPS.forEach(app => {
        const appRef = doc(db, "applications", app.id);
        batch.set(appRef, app);
    });

    // 3. Seed Settings
    const settingsRef = doc(db, "portalSettings", "global");
    batch.set(settingsRef, DEFAULT_SETTINGS);

    // 4. Seed Scoring Criteria (Optional, good for reference in DB)
    const criteriaRef = doc(db, "config", "scoringCriteria");
    batch.set(criteriaRef, { items: SCORING_CRITERIA });

    await batch.commit();
    console.log("Database Seeded Successfully!");
};


// --- SERVICE WRAPPER ---
// This switches between LocalStorage (Mock) and Firebase (Real) based on USE_DEMO_MODE

class AuthService {
  // --- AUTH ---
  async login(identifier: string, pass: string): Promise<User> {
    if (USE_DEMO_MODE) return api.mockLogin(identifier, pass);
    
    // Real Firebase Login
    // Note: Username login is not natively supported by Firebase client SDK.
    // For real app, usually strictly use Email. 
    // This is a simple shim to support the "louise.white" style usernames in your demo data.
    let email = identifier;
    if (!email.includes('@')) {
        email = `${identifier}@committee.local`; // Synthetic domain helper
    }

    if (!auth || !db) throw new Error("Firebase not initialized");
    
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);
        // Fetch profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
        if (userDoc.exists()) {
            return userDoc.data() as User;
        } else {
            // Fallback if auth exists but no profile (shouldn't happen if seeded)
            return {
                uid: userCred.user.uid,
                email: userCred.user.email || '',
                role: 'applicant',
                displayName: userCred.user.displayName || 'User'
            };
        }
    } catch (error: any) {
        console.error("Login failed", error);
        throw new Error("Login failed. If you just seeded, you still need to create the Auth accounts in Firebase Console or use 'Register'.");
    }
  }

  async register(email: string, pass: string, name: string): Promise<User> {
    if (USE_DEMO_MODE) return api.mockRegister(email, pass, name);

    if (!auth || !db) throw new Error("Firebase not initialized");

    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    const newUser: User = {
        uid: userCred.user.uid,
        email: email,
        displayName: name,
        role: 'applicant'
    };
    
    // Create Profile Document
    await setDoc(doc(db, 'users', newUser.uid), newUser);
    return newUser;
  }

  // --- DATA METHODS ---
  async getApplications(area?: string): Promise<Application[]> {
      if (USE_DEMO_MODE) return api.mockGetApps(area);
      if (!db) return [];

      let q;
      if (area && area !== 'All') {
          // Note: In real Firestore, OR queries (area == X OR area == Cross) require composite indexes or separate queries.
          // For simplicity, we'll fetch all and filter in client, or specific area.
          // Let's fetch all for this scale (small dataset).
           const querySnapshot = await getDocs(collection(db, "applications"));
           const apps = querySnapshot.docs.map(d => d.data() as Application);
           return apps.filter(a => a.area === area || a.area === 'Cross-Area');
      } else {
          const querySnapshot = await getDocs(collection(db, "applications"));
          return querySnapshot.docs.map(d => d.data() as Application);
      }
  }

  async createApplication(app: Omit<Application, 'id' | 'createdAt' | 'ref' | 'status'>): Promise<void> {
      if (USE_DEMO_MODE) return api.mockCreateApp(app);
      if (!db) return;

      const areaCode = app.area.substring(0, 3).toUpperCase();
      const randomRef = Math.floor(100 + Math.random() * 900);
      const newId = 'app_' + Date.now();
      
      const newApp: Application = {
          ...app,
          id: newId,
          createdAt: Date.now(),
          status: 'Submitted-Stage1',
          ref: `PB-${areaCode}-${randomRef}`
      };

      await setDoc(doc(db, 'applications', newId), newApp);
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<void> {
      if (USE_DEMO_MODE) return api.mockUpdateApp(id, updates);
      if (!db) return;
      await setDoc(doc(db, 'applications', id), updates, { merge: true });
  }

  async deleteApplication(id: string): Promise<void> {
      if (USE_DEMO_MODE) return api.mockDeleteApp(id);
      if (!db) return;
      await deleteDoc(doc(db, 'applications', id));
  }

  // --- SCORES ---
  async saveScore(score: Score): Promise<void> {
      if (USE_DEMO_MODE) return api.mockSaveScore(score);
      if (!db) return;
      
      // We store scores in a top-level collection "scores"
      // ID can be composite: appId_scorerId
      const scoreId = `${score.appId}_${score.scorerId}`;
      await setDoc(doc(db, 'scores', scoreId), score);
  }

  async getScores(): Promise<Score[]> {
      if (USE_DEMO_MODE) return api.mockGetScores();
      if (!db) return [];
      
      const snap = await getDocs(collection(db, 'scores'));
      return snap.docs.map(d => d.data() as Score);
  }
  
  async resetUserScores(scorerId: string): Promise<void> {
      if(USE_DEMO_MODE) return api.mockResetUserScores(scorerId);
      if(!db) return;

      const q = query(collection(db, "scores"), where("scorerId", "==", scorerId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
  }

  // --- SETTINGS ---
  async getPortalSettings(): Promise<PortalSettings> {
      if (USE_DEMO_MODE) return api.mockGetSettings();
      if (!db) return DEFAULT_SETTINGS;
      
      const docSnap = await getDoc(doc(db, 'portalSettings', 'global'));
      if (docSnap.exists()) return docSnap.data() as PortalSettings;
      return DEFAULT_SETTINGS;
  }

  async updatePortalSettings(s: PortalSettings): Promise<void> {
      if (USE_DEMO_MODE) return api.mockUpdateSettings(s);
      if (!db) return;
      await setDoc(doc(db, 'portalSettings', 'global'), s);
  }

  // --- USERS ---
  async getUsers(): Promise<User[]> {
      if (USE_DEMO_MODE) return api.mockGetUsers();
      if (!db) return [];
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => d.data() as User);
  }

  async updateUserProfile(uid: string, updates: Partial<User>): Promise<User> {
      if (USE_DEMO_MODE) return api.mockUpdateProfile(uid, updates);
      if (!db) throw new Error("No DB");
      
      await setDoc(doc(db, 'users', uid), updates, { merge: true });
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.data() as User;
  }
  
  async deleteUser(uid: string): Promise<void> {
       if (USE_DEMO_MODE) return api.mockDeleteUser(uid);
       if (!db) return;
       await deleteDoc(doc(db, 'users', uid));
  }
  
  async updateUser(user: User): Promise<void> {
      if (USE_DEMO_MODE) return api.mockUpdateUser(user);
      if (!db) return;
      await setDoc(doc(db, 'users', user.uid), user, { merge: true });
  }

  async adminCreateUser(user: User, pass: string): Promise<void> {
      if (USE_DEMO_MODE) return api.mockAdminCreateUser(user, pass);
      // In real firebase, creating a user usually requires a secondary Admin App or Cloud Function
      // to avoid logging out the current admin. 
      // For this simple port, we'll throw an error or just create the Firestore doc.
      throw new Error("In Real Firebase mode, Admin cannot create Auth users directly from client without Cloud Functions. Please use the Firebase Console.");
  }


  // --- MOCK IMPLEMENTATIONS (Preserved for fallback) ---
  private getLocal<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }
  private setLocal<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  mockLogin(identifier: string, pass: string): Promise<User> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let emailToSearch = identifier.toLowerCase();
            if (!emailToSearch.includes('@')) emailToSearch = `${emailToSearch}@committee.local`;
            const users = this.getLocal<User>('users');
            if (users.length === 0) this.setLocal('users', DEMO_USERS); // Auto-seed mock
            
            const user = users.find(u => 
                (u.email.toLowerCase() === emailToSearch || u.username?.toLowerCase() === identifier.toLowerCase()) 
                && u.password === pass
            );
            if (user) {
                const { password, ...safe } = user;
                resolve(safe as User);
            } else {
                reject(new Error("Invalid credentials (Mock)"));
            }
        }, 500);
    });
  }
  
  mockRegister(email: string, pass: string, name: string): Promise<User> {
       return new Promise((resolve) => {
           const users = this.getLocal<User>('users');
           const newUser = { uid: 'user_'+Date.now(), email, password: pass, displayName: name, role: 'applicant' as any };
           this.setLocal('users', [...users, newUser]);
           resolve({ ...newUser, password: undefined } as User);
       });
  }

  mockGetApps(area?: string): Promise<Application[]> {
       const apps = this.getLocal<Application>('apps');
       if (!localStorage.getItem('apps')) this.setLocal('apps', DEMO_APPS); // Auto-seed
       if (!area || area === 'All') return Promise.resolve(apps);
       return Promise.resolve(apps.filter(a => a.area === area || a.area === 'Cross-Area'));
  }
  
  mockCreateApp(app: any): Promise<void> {
      const apps = this.getLocal<Application>('apps');
      const areaCode = app.area.substring(0, 3).toUpperCase();
      const newApp = { 
          ...app, 
          id: 'app_' + Date.now(), 
          createdAt: Date.now(), 
          status: 'Submitted-Stage1', 
          ref: `PB-${areaCode}-${Math.floor(100+Math.random()*900)}` 
      };
      this.setLocal('apps', [...apps, newApp]);
      return Promise.resolve();
  }

  mockUpdateApp(id: string, updates: any): Promise<void> {
      const apps = this.getLocal<Application>('apps');
      const idx = apps.findIndex(a => a.id === id);
      if (idx !== -1) {
          apps[idx] = { ...apps[idx], ...updates };
          this.setLocal('apps', apps);
      }
      return Promise.resolve();
  }
  
  mockDeleteApp(id: string): Promise<void> {
      const apps = this.getLocal<Application>('apps');
      this.setLocal('apps', apps.filter(a => a.id !== id));
      return Promise.resolve();
  }

  mockSaveScore(score: Score): Promise<void> {
      const scores = this.getLocal<Score>('scores');
      const idx = scores.findIndex(s => s.appId === score.appId && s.scorerId === score.scorerId);
      if (idx >= 0) scores[idx] = score;
      else scores.push(score);
      this.setLocal('scores', scores);
      return Promise.resolve();
  }

  mockGetScores(): Promise<Score[]> {
      return Promise.resolve(this.getLocal<Score>('scores'));
  }

  mockGetSettings(): Promise<PortalSettings> {
      return Promise.resolve(this.getLocal<PortalSettings>('portalSettings')[0] || DEFAULT_SETTINGS); // Mock stores as array, quirk fix
  }
  
  mockUpdateSettings(s: PortalSettings): Promise<void> {
      this.setLocal('portalSettings', [s]);
      return Promise.resolve();
  }
  
  mockGetUsers(): Promise<User[]> {
      const users = this.getLocal<User>('users');
      if (users.length === 0) { this.setLocal('users', DEMO_USERS); return Promise.resolve(DEMO_USERS); }
      return Promise.resolve(users);
  }
  
  mockUpdateProfile(uid: string, updates: any): Promise<User> {
      const users = this.getLocal<User>('users');
      const idx = users.findIndex(u => u.uid === uid);
      users[idx] = { ...users[idx], ...updates };
      this.setLocal('users', users);
      return Promise.resolve(users[idx]);
  }
  
  mockDeleteUser(uid: string): Promise<void> {
      const users = this.getLocal<User>('users');
      this.setLocal('users', users.filter(u => u.uid !== uid));
      return Promise.resolve();
  }
  
  mockUpdateUser(user: User): Promise<void> {
      const users = this.getLocal<User>('users');
      const idx = users.findIndex(u => u.uid === user.uid);
      if (idx !== -1) {
          users[idx] = { ...users[idx], ...user };
          this.setLocal('users', users);
      }
      return Promise.resolve();
  }
  
  mockAdminCreateUser(user: User, pass: string): Promise<void> {
      const users = this.getLocal<User>('users');
      this.setLocal('users', [...users, { ...user, password: pass, uid: 'user_'+Date.now() }]);
      return Promise.resolve();
  }

  mockResetUserScores(scorerId: string): Promise<void> {
      const scores = this.getLocal<Score>('scores');
      this.setLocal('scores', scores.filter(s => s.scorerId !== scorerId));
      return Promise.resolve();
  }
}

export const api = new AuthService();

