// frontend/src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type':  'application/json',
    'Accept': 'application/json' // Esto le dice a Laravel que responda como API
  })
};

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  public apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}
  // Tocken HMTL
  getCsrfToken(): string {
    const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    return metaTag ? metaTag.content : '';
  }
  // Métodos genéricos
  get<T>(endpoint: string, params?: any): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { params });
  }
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, data);
  }
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, data);
  }
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`);
  }

  procesarExcel() {
    return this.http.post(`${this.apiUrl}/download/excel`,{});
  }
  descargarExcel(data: any) {
    return this.http.post(`${this.apiUrl}/download-excel`,data,httpOptions);
  }
  getUsuarios(data: any) {
    return this.http.get(`${this.apiUrl}/usuarios/get`,data);
  }
  getPermisos(data: any) {
    return this.http.get(`${this.apiUrl}/permisos/get`,data);
  }
  getModulos(data: any) {
    return this.http.get(`${this.apiUrl}/modulos/get`,data);
  }

  getSistemas(){
    return this.http.get(`${this.apiUrl}/catalogos/getSistemas`);
  }

  getScripts(data: any){
    return this.http.get(`${this.apiUrl}/scripts/get`);
  }

  getArchivosDB(data: any){
    return this.http.get(`${this.apiUrl}/archivos-db/get`,);
  }
  
  validarTabla(data: any){
    return this.http.get(`${this.apiUrl}/excel/validarTabla`,);
  }
}