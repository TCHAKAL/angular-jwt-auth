import {Injectable} from "@angular/core";
import {BehaviorSubject, map, Observable} from "rxjs";
import {HttpClient, HttpEvent} from "@angular/common/http";
import {environnement} from "../../environnement/environnement";
import jwtDecode from 'jwt-decode';

@Injectable(
  {
    providedIn: 'root'
  }
)
export class AuthService {

  ACCESS_TOKEN = 'access_token';
  REFRESH_TOKEN = 'refresh_token';

  private userDataSubject: BehaviorSubject<any> = new BehaviorSubject(null);
  userData$: Observable<any> = this.userDataSubject.asObservable();

  constructor(private http: HttpClient) {
    if (localStorage.getItem(this.ACCESS_TOKEN) && localStorage.getItem(this.REFRESH_TOKEN)) {
      const access_token = (<string>localStorage.getItem(this.ACCESS_TOKEN));
      const refresh_token = (<string>localStorage.getItem(this.REFRESH_TOKEN));
      this.userDataSubject.next({access_token, refresh_token, userInfo: this.getUserDataFromToken(access_token)});
    }
  }

  get userData(): any {
    return this.userDataSubject.value;
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${environnement.apiBaseUrl}/auth/login`, {email, password})
      .pipe(
        map((res: any) => {
          const access_token = res?.data.access_token;
          const refresh_token = res?.data.refresh_token;
          this.userDataSubject.next({access_token, refresh_token, userIngo: this.getUserDataFromToken(access_token)})
          localStorage.setItem(this.ACCESS_TOKEN, access_token);
          localStorage.setItem(this.REFRESH_TOKEN, refresh_token);
          return res;
        })
      )
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN);
    localStorage.removeItem(this.REFRESH_TOKEN);
    this.userDataSubject.next(null);
    //this.http.get('logout url').pipe();
  }

  generateNewTokens(): Observable<HttpEvent<any>> {
    const refresh_token = this.userDataSubject.value?.refresh_token;
    return this.http.post(`${environnement.apiBaseUrl}/auth/refresh`, {refresh_token})
      .pipe(
        map((res: any) => {
          const access_token = res?.data.access_token;
          const refresh_roken = res?.data.refres_token;
          this.userDataSubject.next({access_token, refresh_roken, userInfo: this.getUserDataFromToken(access_token)});
          localStorage.setItem(this.ACCESS_TOKEN, access_token);
          localStorage.setItem(this.REFRESH_TOKEN, refresh_token);
          return res;
        })
      )
  }

  get isAuthenticated(): boolean {
    const refresh_token = this.userDataSubject.value?.refresh_token;
    if (!refresh_token) {
      return false;
    }
    return this.isAuthTokenValid(refresh_token);
  }

  private isAuthTokenValid(refresh_token: string): boolean {
    const decoded: any = jwtDecode(refresh_token);
    const expMilSecond: number = decoded?.exp * 1000;//milliseconds
    return expMilSecond < Date.now();
  }

  private getUserDataFromToken(access_token: string): any {
    const decoded: any = jwtDecode(access_token);
    return decoded.data;
  }
}
