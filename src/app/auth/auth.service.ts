import {HttpClient, HttpEvent} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import jwtDecode from 'jwt-decode';
import {environnement} from "../../environnement/environnement";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  ACCESS_TOKEN = 'access_token';
  REFRESH_TOKEN = 'refresh_token';
  private userDataSubject: BehaviorSubject<any> = new BehaviorSubject(null);
  userData$: Observable<any> = this.userDataSubject.asObservable();

  constructor(private http: HttpClient) {
    if (localStorage.getItem(this.ACCESS_TOKEN) && localStorage.getItem(this.REFRESH_TOKEN)) {
      const access_token = (<string>localStorage.getItem(this.ACCESS_TOKEN));
      const refresh_token = (<string>localStorage.getItem(this.REFRESH_TOKEN))
      this.userDataSubject.next({access_token, refresh_token, userInfo: this.getUserDataFromToken(access_token)})
    }
  }

  get getUserData(): any {
    // return userData(userInfo, access_token, refresh_token) or null
    return this.userDataSubject.value
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${environnement.apiBaseUrl}/auth/login`, {email, password}).pipe(
      map((res: any) => {
        const access_token = res?.data?.access_token;
        const refresh_token = res?.data?.refresh_token;
        this.userDataSubject.next({access_token, refresh_token, userInfo: this.getUserDataFromToken(access_token)});
        localStorage.setItem(this.ACCESS_TOKEN, access_token)
        localStorage.setItem(this.REFRESH_TOKEN, refresh_token)
        return res
      })
    )
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN);
    localStorage.removeItem(this.REFRESH_TOKEN);
    this.userDataSubject.next(null);
    // Call http logout method for block refresh token
  }

  generateNewTokens(): Observable<HttpEvent<any>> {
    const refresh_token = this.userDataSubject.value?.refresh_token;
    return this.http.post(`${environnement.apiBaseUrl}/auth/refresh`, {refresh_token}).pipe(
      map((res: any) => {
        const access_token = res?.data?.access_token;
        const refresh_token = res?.data?.refresh_token;
        this.userDataSubject.next({access_token, refresh_token, userData: this.getUserDataFromToken(access_token)});
        localStorage.setItem(this.ACCESS_TOKEN, access_token);
        localStorage.setItem(this.REFRESH_TOKEN, refresh_token);
        return res
      })
    )
  }

  get isAuthenticated(): boolean {
    const refresh_token = this.userDataSubject.value?.refresh_token;
    if (!refresh_token) {
      return false
    }
    return this.isAuthTokenValid(refresh_token)
  }

  isAuthTokenValid(token: string): boolean {
    const decoded: any = jwtDecode(token);
    // default decoded exp format is second
    const expMilSecond: number = decoded?.exp * 1000; // milliseconds
    const currentTime = Date.now(); // milliseconds
    if (expMilSecond < currentTime) {
      return false;
    }
    return true;
  }

  getUserDataFromToken(token: string): any {
    const decoded: any = jwtDecode(token);
    return decoded.data
  }
}
