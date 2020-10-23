import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URLS } from 'src/app/utils/constants';

@Injectable(
  {providedIn:'root'}
) 
export class CharacterService {

  httpClient: HttpClient;

  constructor(httpClient : HttpClient) {
    this.httpClient = httpClient;
  }

  initCharacters() {
     return this.httpClient.get(URLS.characters);
  }
}