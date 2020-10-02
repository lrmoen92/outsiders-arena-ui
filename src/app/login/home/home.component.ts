import { HttpClient } from '@angular/common/http';
import { Component, Input, } from '@angular/core';
import { Router } from '@angular/router';
import { Character } from 'src/app/model/api-models';
import { CharacterService } from '../character/character.service';

@Component({
  selector: 'home-root',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  allCharacters : Array<Character>;
  httpClient: HttpClient;

  constructor(httpClient : HttpClient, service : CharacterService) {
    this.httpClient = httpClient;
    this.allCharacters = service.getAllCharacters();
	}
}
