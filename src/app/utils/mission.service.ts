import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { take } from 'rxjs/operators';
import { URLS } from 'src/app/utils/constants';
import { Character } from '../model/api-models';

@Injectable(
  {providedIn:'root'}
) 
export class MissionService {

  httpClient: HttpClient;

  constructor(httpClient : HttpClient) {
    this.httpClient = httpClient;
  }

  initMissions() {
    return this.httpClient.get(URLS.missions);
  }
}