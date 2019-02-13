import { Injectable, NgZone } from "@angular/core";
import { User } from "../services/user";
import { auth } from "firebase/app";
import { AngularFireAuth } from "@angular/fire/auth";
import {
  AngularFirestore,
  AngularFirestoreDocument
} from "@angular/fire/firestore";
import { Router } from "@angular/router";

@Injectable({
  providedIn: "root"
})
export class AuthService {
  userData: any; // Save logged in user data

  constructor(
    private angularFirestore: AngularFirestore,
    private angularFireAuth: AngularFireAuth,
    private router: Router,
    private ngZone: NgZone
  ) {
    /* Saving user data in localstorage when 
    logged in and setting up null when logged out */
    this.angularFireAuth.authState.subscribe(user => {
      if (user) {
        this.userData = user;
        localStorage.setItem("user", JSON.stringify(this.userData));
        JSON.parse(localStorage.getItem("user"));
      } else {
        localStorage.setItem("user", null);
        JSON.parse(localStorage.getItem("user"));
      }
    });
  }

  signIn(email, password) {
    return this.angularFireAuth.auth
      .signInWithEmailAndPassword(email, password)
      .then(result => {
        this.ngZone.run(() => {
          this.router.navigate(["dashboard"]);
        });
        this.setUserData(result.user);
      })
      .catch(error => {
        window.alert(error.message);
      });
  }

  signUp(email, password) {
    return this.angularFireAuth.auth
      .createUserWithEmailAndPassword(email, password)
      .then(result => {
        /* Call the SendVerificaitonMail() function when new user sign 
        up and returns promise */
        this.sendVerificationEmail();
        this.setUserData(result.user);
      })
      .catch(error => {
        window.alert(error.message);
      });
  }

  // Send email verfificaiton when new user sign up
  sendVerificationEmail() {
    return this.angularFireAuth.auth.currentUser
      .sendEmailVerification()
      .then(() => {
        this.router.navigate(["verify-email-address"]);
      });
  }

  // Reset Forggot password
  forgotPassword(passwordResetEmail) {
    return this.angularFireAuth.auth
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        window.alert("Password reset email sent, check your inbox.");
      })
      .catch(error => {
        window.alert(error);
      });
  }

  // Returns true when user is looged in and email is verified
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem("user"));

    return user != null && user.email.verfificaiton !== false ? true : false;
  }

  // Sign in with Google

  googleAuth() {
    return this.authLogin(new auth.GoogleAuthProvider());
  }

  // Auth logic to run auth providers
  authLogin(provider) {
    return this.angularFireAuth.auth
      .signInWithPopup(provider)
      .then(result => {
        this.ngZone.run(() => {
          this.router.navigate(["dashboard"]);
        });
        this.setUserData(result.user);
      })
      .catch(error => {
        window.alert(error);
      });
  }

  /* Setting up user data when sign in with username/password, 
  sign up with username/password and sign in with social auth  
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  setUserData(user) {
    const userRef: AngularFirestoreDocument<any> = this.angularFirestore.doc(`users/${user.uid}`);
    const userData: User = {
      id: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    }
    return userRef.set(userData, {
      merge: true
    })
  }

  // Sign out
  signOut() {
    return this.angularFireAuth.auth.signOut().then(() => {
      localStorage.removeItem("user");
      this.router.navigate(["sign-in"]);
    });
  }
}
