import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, map } from 'rxjs';

const AUTH_DATA = "auth_data";

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authStateChanged: Subject<boolean> = new BehaviorSubject<boolean>(false);
  isSignedIn$ : Observable<boolean> = this.authStateChanged.asObservable();
  isSignedOut$ : Observable<boolean>;

  constructor(private http: HttpClient) {
    this.isSignedOut$ = this.isSignedIn$.pipe(map(loggedIn => !loggedIn));

    const isSignedIn = localStorage.getItem(AUTH_DATA);

    if (isSignedIn) {
      this.authStateChanged.next(JSON.parse(isSignedIn));
    }
  }

  public signIn(email: string, password: string) {
    return this.http.post('/api/account/login?useCookies=true', {
      email: email,
      password: password
    }, {
      observe: 'response',
      responseType: 'text'
    })
      .pipe<boolean>(map((res: HttpResponse<string>) => {
        this.authStateChanged.next(res.ok);
        localStorage.setItem(AUTH_DATA, JSON.stringify(res.ok));
        return res.ok;
      }));
  }

  public signOut() {
    return this.http.post('/api/account/logout', null, {
      observe: 'response',
      responseType: 'text'
    })
      .pipe<boolean>(map((res: HttpResponse<string>) => {
        this.authStateChanged.next(false);
        localStorage.removeItem(AUTH_DATA);
        return res.ok;
      }));
  }

  public register(email: string, password: string) {
    return this.http.post('/api/account/register', {
      email: email,
      password: password
    }, {
      observe: 'response',
      responseType: 'text'
    }).pipe<boolean>(map((res: HttpResponse<string>) => res.ok));
  }
}
