import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, scheduled } from 'rxjs';
import { Character } from 'src/app/model/api-models';
import { URLS } from 'src/app/utils/constants';

@Injectable(
  {providedIn:'root'}
) 
export class CharacterService {

    allCharacters : Array<Character>;
    httpClient: HttpClient;
  
    constructor(httpClient : HttpClient) {
      this.httpClient = httpClient;
    }

    getCharacters() : Observable<Array<Character>> {
      if (this.allCharacters) {
        
        console.log("retrieved cache");
        console.log(this.allCharacters);
        return of(this.allCharacters);
      } else {
        return <Observable<Array<Character>>> this.httpClient.get(URLS.characters);
      }
    }

    setCharacters(allCharacters : Array<Character>) : void {
      this.allCharacters = allCharacters;
    }

    getAllCharacters() : Array<Character> {
      return this.allCharacters;
    }

}