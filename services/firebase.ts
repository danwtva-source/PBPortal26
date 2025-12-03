import { User, Application, Score, PortalSettings } from '../types';
import { DEMO_USERS, DEMO_APPS } from '../constants';

// --- CONFIGURATION ---
// CHANGED: We are setting this to false to use Real Firebase
const USE_DEMO_MODE = false; 

// --- REAL FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from "firebase/firestore";

// --- PASTE YOUR KEYS HERE ---
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBH4fnIKGK4zyY754ahI5NBiayBCcAU7UU",
  authDomain: "pb-portal-2026.firebaseapp.com",
  projectId: "pb-portal-2026",
  storageBucket: "pb-portal-2026.firebasestorage.app",
  messagingSenderId: "810167292126",
  appId: "1:810167292126:web:91128e5a8c67e4b6fb324f",
  measurementId: "G-9L1GX3J9H7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_SETTINGS: PortalSettings = {
    stage1Visible: true,
    stage2Visible: false,
    votingOpen: false
};

// --- REAL SERVICE (Connects to Firebase) ---
class FirebaseService {
  
  // --- PORTAL SETTINGS ---
  async getPortalSettings(): Promise<PortalSettings> {
      try {
        const docRef = doc(db, "settings", "portal");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as PortalSettings;
        } else {
          // Create default if it doesn't exist
          await setDoc(docRef, DEFAULT_SETTINGS);
          return DEFAULT_SETTINGS;
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        return DEFAULT_SETTINGS;
      }
  }

  async updatePortalSettings(settings: PortalSettings): Promise<void> {
      await setDoc(doc(db, "settings", "portal"), settings);
  }

  // --- AUTH ---
  async login(identifier: string, pass: string): Promise<User> {
    // Logic to handle "Username" login by converting to synthetic email
    let emailToSearch = identifier.toLowerCase();
    if (!emailToSearch.includes('@')) {
        emailToSearch = `${emailToSearch}@committee.local`;
    }

    // 1. Log in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, emailToSearch, pass);
    const uid = userCredential.user.uid;

    // 2. Fetch extra user details (like Role) from Firestore
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data() as User;
    } else {
      // Fallback if auth exists but firestore doc is missing
      throw new Error("User profile not found in database.");
    }
  }

  async register(email: string, pass: string, name: string): Promise<User> {
    // 1. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = userCredential.user.uid;

    // 2. Create User Document in Firestore
    const newUser: User = { 
        uid: uid, 
        email, 
        // We do NOT save the password to the database for security
        password: "", 
        role: 'applicant', // Default role
        displayName: name,
        username: email.split('@')[0]
    };

    await setDoc(doc(db, "users", uid), newUser);
    return newUser;
  }

  // --- PROFILE MANAGEMENT ---
  async updateUserProfile(uid: string, updates: Partial<User>): Promise<User> {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, updates);
      
      const updatedSnap = await getDoc(userRef);
      return updatedSnap.data() as User;
  }

  // --- APPLICATION METHODS ---
  async getApplications(area?: string): Promise<Application[]> {
    // Get all apps
    const querySnapshot = await getDocs(collection(db, "apps"));
    const apps: Application[] = [];
    querySnapshot.forEach((doc) => {
      apps.push(doc.data() as Application);
    });

    // Filter locally (easier for small apps than complex DB queries)
    if (!area || area === 'All') return apps;
    return apps.filter(a => a.area === area || a.area === 'Cross-Area');
  }

  async createApplication(app: Omit<Application, 'id' | 'createdAt' | 'ref' | 'status'>): Promise<void> {
    const areaCode = app.area.substring(0, 3).toUpperCase();
    const randomRef = Math.floor(100 + Math.random() * 900);
    const appId = 'app_' + Date.now();
    
    const newApp: Application = {
        ...app,
        id: appId,
        createdAt: Date.now(),
        status: 'Submitted-Stage1',
        ref: `PB-${areaCode}-${randomRef}`
    };

    await setDoc(doc(db, "apps", appId), newApp);
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<void> {
      const appRef = doc(db, "apps", id);
      await updateDoc(appRef, updates);
  }

  async deleteApplication(id: string): Promise<void> {
      await deleteDoc(doc(db, "apps", id));
      
      // Also cleanup scores for this app
      const scoresQuery = query(collection(db, "scores"), where("appId", "==", id));
      const querySnapshot = await getDocs(scoresQuery);
      querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
      });
  }

  // --- SCORE METHODS ---
  async saveScore(score: Score): Promise<void> {
    // Create a unique ID for the score based on App + Scorer
    const scoreId = `${score.appId}_${score.scorerId}`;
    await setDoc(doc(db, "scores", scoreId), score);
  }

  async getScores(): Promise<Score[]> {
    const querySnapshot = await getDocs(collection(db, "scores"));
    const scores: Score[] = [];
    querySnapshot.forEach((doc) => {
      scores.push(doc.data() as Score);
    });
    return scores;
  }

  async deleteScore(appId: string, scorerId: string): Promise<void> {
      const scoreId = `${appId}_${scorerId}`;
      await deleteDoc(doc(db, "scores", scoreId));
  }
  
  async resetUserScores(scorerId: string, appId?: string): Promise<void> {
      let q;
      if (appId) {
        // Delete specific score
         const scoreId = `${appId}_${scorerId}`;
         await deleteDoc(doc(db, "scores", scoreId));
         return;
      } else {
        // Delete ALL scores for user
        q = query(collection(db, "scores"), where("scorerId", "==", scorerId));
      }

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
      });
  }

  // --- USER MANAGEMENT METHODS ---
  async getUsers(): Promise<User[]> {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as User);
    });
    return users;
  }

  async adminCreateUser(user: User, pass: string): Promise<void> {
      // Note: In client-side Firebase, you cannot easily create a SECOND user 
      // without logging out the current admin. 
      // For this free version, we will just create the Firestore document 
      // so they show up in the list, but they won't have a real Login 
      // until they actually sign up themselves, or you create a cloud function.
      // FOR NOW: We will throw an error explaining this limitation.
      alert("In this free setup, Admin cannot create accounts for others directly. Please ask the user to Register themselves on the login screen.");
  }

  async updateUser(user: User): Promise<void> {
    const { password, ...safeUser } = user; // Don't save password to DB
    await setDoc(doc(db, "users", user.uid), safeUser, { merge: true });
  }

  async deleteUser(uid: string): Promise<void> {
    await deleteDoc(doc(db, "users", uid));
  }
}

// --- MOCK SERVICE (Backup) ---
class MockService {
  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }
  private set<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  constructor() {
    if (!localStorage.getItem('apps')) this.set('apps', DEMO_APPS);
    if (!localStorage.getItem('scores')) this.set('scores', []);
    if (!localStorage.getItem('portalSettings')) localStorage.setItem('portalSettings', JSON.stringify(DEFAULT_SETTINGS));
    
    const currentUsers = this.get<User>('users');
    if (currentUsers.length === 0) {
        this.set('users', DEMO_USERS);
    } else {
        const userIds = currentUsers.map(u => u.uid);
        const newDemoUsers = DEMO_USERS.filter(u => !userIds.includes(u.uid));
        if (newDemoUsers.length > 0) {
            this.set('users', [...currentUsers, ...newDemoUsers]);
        }
    }
  }

  async getPortalSettings(): Promise<PortalSettings> {
      const s = localStorage.getItem('portalSettings');
      return s ? JSON.parse(s) : DEFAULT_SETTINGS;
  }
  async updatePortalSettings(settings: PortalSettings): Promise<void> {
      localStorage.setItem('portalSettings', JSON.stringify(settings));
  }
  async login(identifier: string, pass: string): Promise<User> {
    await new Promise(r => setTimeout(r, 600)); 
    let emailToSearch = identifier.toLowerCase();
    if (!emailToSearch.includes('@')) emailToSearch = `${emailToSearch}@committee.local`;

    const users = this.get<User>('users');
    const user = users.find(u => 
        (u.email.toLowerCase() === emailToSearch || u.username?.toLowerCase() === identifier.toLowerCase()) 
        && u.password === pass
    );
    if (user) {
        const { password, ...safeUser } = user;
        return safeUser as User;
    }
    throw new Error("Invalid credentials.");
  }
  async register(email: string, pass: string, name: string): Promise<User> {
    await new Promise(r => setTimeout(r, 600));
    const users = this.get<User>('users');
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) throw new Error("User already exists");
    const newUser: User = { 
        uid: 'user_' + Date.now(), 
        email, password: pass, role: 'applicant', displayName: name, username: email.split('@')[0]
    };
    this.set('users', [...users, newUser]);
    const { password, ...safeUser } = newUser;
    return safeUser as User;
  }
  async updateUserProfile(uid: string, updates: Partial<User>): Promise<User> {
      const users = this.get<User>('users');
      const idx = users.findIndex(u => u.uid === uid);
      if (idx === -1) throw new Error("User not found");
      const updatedUser = { ...users[idx], ...updates };
      users[idx] = updatedUser;
      this.set('users', users);
      const { password, ...safeUser } = updatedUser;
      return safeUser as User;
  }
  async getApplications(area?: string): Promise<Application[]> {
    const apps = this.get<Application>('apps');
    if (!area || area === 'All') return apps;
    return apps.filter(a => a.area === area || a.area === 'Cross-Area');
  }
  async createApplication(app: Omit<Application, 'id' | 'createdAt' | 'ref' | 'status'>): Promise<void> {
    const apps = this.get<Application>('apps');
    const areaCode = app.area.substring(0, 3).toUpperCase();
    const randomRef = Math.floor(100 + Math.random() * 900);
    const newApp: Application = {
        ...app, id: 'app_' + Date.now(), createdAt: Date.now(), status: 'Submitted-Stage1', ref: `PB-${areaCode}-${randomRef}`
    };
    this.set('apps', [...apps, newApp]);
  }
  async updateApplication(id: string, updates: Partial<Application>): Promise<void> {
      const apps = this.get<Application>('apps');
      const idx = apps.findIndex(a => a.id === id);
      if (idx !== -1) { apps[idx] = { ...apps[idx], ...updates }; this.set('apps', apps); }
  }
  async deleteApplication(id: string): Promise<void> {
      const apps = this.get<Application>('apps');
      this.set('apps', apps.filter(a => a.id !== id));
      const scores = this.get<Score>('scores');
      this.set('scores', scores.filter(s => s.appId !== id));
  }
  async saveScore(score: Score): Promise<void> {
    const scores = this.get<Score>('scores');
    const idx = scores.findIndex(s => s.appId === score.appId && s.scorerId === score.scorerId);
    if (idx >= 0) scores[idx] = score; else scores.push(score);
    this.set('scores', scores);
  }
  async getScores(): Promise<Score[]> { return this.get<Score>('scores'); }
  async deleteScore(appId: string, scorerId: string): Promise<void> {
      const scores = this.get<Score>('scores');
      this.set('scores', scores.filter(s => !(s.appId === appId && s.scorerId === scorerId)));
  }
  async resetUserScores(scorerId: string, appId?: string): Promise<void> {
      const scores = this.get<Score>('scores');
      const newScores = scores.filter(s => {
          if (appId) return !(s.scorerId === scorerId && s.appId === appId);
          return s.scorerId !== scorerId;
      });
      this.set('scores', newScores);
  }
  async getUsers(): Promise<User[]> {
    const users = this.get<User>('users');
    return users.map(({ password, ...u }) => u);
  }
  async adminCreateUser(user: User, pass: string): Promise<void> {
      const users = this.get<User>('users');
      if (users.find(u => u.email === user.email)) throw new Error("Email exists");
      const newUser = { ...user, password: pass, uid: 'user_' + Date.now() };
      this.set('users', [...users, newUser]);
  }
  async updateUser(user: User): Promise<void> {
    const users = this.get<User>('users');
    const idx = users.findIndex(u => u.uid === user.uid);
    if (idx !== -1) {
        const existingPassword = users[idx].password;
        users[idx] = { ...users[idx], ...user, password: existingPassword };
        this.set('users', users);
    }
  }
  async deleteUser(uid: string): Promise<void> {
    const users = this.get<User>('users');
    this.set('users', users.filter(u => u.uid !== uid));
  }
}

// --- EXPORT THE CORRECT SERVICE ---
// If USE_DEMO_MODE is true, use Mock. If false, use Real Firebase.
export const api = USE_DEMO_MODE ? new MockService() : new FirebaseService();