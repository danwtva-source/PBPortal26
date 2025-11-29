
import { User, Application, Score, PortalSettings } from '../types';
import { DEMO_USERS, DEMO_APPS } from '../constants';

// --- CONFIGURATION ---
// Set this to false when you add real keys below
const USE_DEMO_MODE = true; 

// --- REAL FIREBASE IMPORTS (Commented out for safety until keys added) ---
/*
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile as fbUpdateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
*/

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase (Conditional)
/*
const app = !USE_DEMO_MODE ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
*/

const DEFAULT_SETTINGS: PortalSettings = {
    stage1Visible: true,
    stage2Visible: false,
    votingOpen: false
};

// --- MOCK SERVICE (Local Storage) ---
class MockService {
  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }
  private set<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  constructor() {
    // Seed data if empty
    if (!localStorage.getItem('apps')) this.set('apps', DEMO_APPS);
    if (!localStorage.getItem('scores')) this.set('scores', []);
    if (!localStorage.getItem('portalSettings')) localStorage.setItem('portalSettings', JSON.stringify(DEFAULT_SETTINGS));
    
    // Always merge demo users if not present to ensure admin access
    const currentUsers = this.get<User>('users');
    if (currentUsers.length === 0) {
        this.set('users', DEMO_USERS);
    } else {
        // Ensure new demo users are added if not present (simple merge)
        const userIds = currentUsers.map(u => u.uid);
        const newDemoUsers = DEMO_USERS.filter(u => !userIds.includes(u.uid));
        if (newDemoUsers.length > 0) {
            this.set('users', [...currentUsers, ...newDemoUsers]);
        }
    }
  }

  // --- PORTAL SETTINGS ---
  async getPortalSettings(): Promise<PortalSettings> {
      const s = localStorage.getItem('portalSettings');
      return s ? JSON.parse(s) : DEFAULT_SETTINGS;
  }

  async updatePortalSettings(settings: PortalSettings): Promise<void> {
      localStorage.setItem('portalSettings', JSON.stringify(settings));
  }

  // --- AUTH ---
  async login(identifier: string, pass: string): Promise<User> {
    await new Promise(r => setTimeout(r, 600)); // Simulate net lag
    
    // Logic to handle "Username" login by converting to synthetic email
    let emailToSearch = identifier.toLowerCase();
    if (!emailToSearch.includes('@')) {
        // If it looks like a username (e.g. 'louise.white'), append dummy domain
        emailToSearch = `${emailToSearch}@committee.local`;
    }

    const users = this.get<User>('users');
    // Check both email and explicit username field
    const user = users.find(u => 
        (u.email.toLowerCase() === emailToSearch || u.username?.toLowerCase() === identifier.toLowerCase()) 
        && u.password === pass
    );
    
    if (user) {
        const { password, ...safeUser } = user;
        return safeUser as User;
    }
    throw new Error("Invalid credentials. Try 'admin' / 'demo' or 'louise.white' / 'demo'");
  }

  async register(email: string, pass: string, name: string): Promise<User> {
    await new Promise(r => setTimeout(r, 600));
    const users = this.get<User>('users');
    
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("User already exists");
    }

    const newUser: User = { 
        uid: 'user_' + Date.now(), 
        email, 
        password: pass, 
        role: 'applicant',
        displayName: name,
        username: email.split('@')[0]
    };
    
    this.set('users', [...users, newUser]);
    
    const { password, ...safeUser } = newUser;
    return safeUser as User;
  }

  // --- PROFILE MANAGEMENT ---
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

  // --- APPLICATION METHODS ---

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
        ...app,
        id: 'app_' + Date.now(),
        createdAt: Date.now(),
        status: 'Submitted-Stage1',
        ref: `PB-${areaCode}-${randomRef}`
    };
    this.set('apps', [...apps, newApp]);
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<void> {
      const apps = this.get<Application>('apps');
      const idx = apps.findIndex(a => a.id === id);
      if (idx !== -1) {
          apps[idx] = { ...apps[idx], ...updates };
          this.set('apps', apps);
      }
  }

  async deleteApplication(id: string): Promise<void> {
      const apps = this.get<Application>('apps');
      this.set('apps', apps.filter(a => a.id !== id));
      // Also cleanup scores
      const scores = this.get<Score>('scores');
      this.set('scores', scores.filter(s => s.appId !== id));
  }

  // --- SCORE METHODS ---

  async saveScore(score: Score): Promise<void> {
    const scores = this.get<Score>('scores');
    const idx = scores.findIndex(s => s.appId === score.appId && s.scorerId === score.scorerId);
    if (idx >= 0) scores[idx] = score;
    else scores.push(score);
    this.set('scores', scores);
  }

  async getScores(): Promise<Score[]> {
    return this.get<Score>('scores');
  }

  async deleteScore(appId: string, scorerId: string): Promise<void> {
      const scores = this.get<Score>('scores');
      this.set('scores', scores.filter(s => !(s.appId === appId && s.scorerId === scorerId)));
  }
  
  // ADMIN ONLY: Wipes all scores for a user or a specific app for a user
  async resetUserScores(scorerId: string, appId?: string): Promise<void> {
      const scores = this.get<Score>('scores');
      const newScores = scores.filter(s => {
          if (appId) {
              // Delete only specific app score for this user
              return !(s.scorerId === scorerId && s.appId === appId);
          }
          // Delete ALL scores for this user
          return s.scorerId !== scorerId;
      });
      this.set('scores', newScores);
  }

  // --- USER MANAGEMENT METHODS ---

  async getUsers(): Promise<User[]> {
    const users = this.get<User>('users');
    return users.map(({ password, ...u }) => u); // Return without passwords
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
        // Preserve password
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

export const api = new MockService();
