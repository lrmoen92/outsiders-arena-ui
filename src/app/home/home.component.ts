import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Character } from 'src/app/model/api-models';
import { CharacterService } from '../character/character.service';

@Component({
  selector: 'home-root',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  allCharacters : Array<Character>;
  service : CharacterService
  httpClient: HttpClient;

  constructor(httpClient : HttpClient, service : CharacterService) {
    this.httpClient = httpClient;
    this.service = service;
  }
  
  ngOnInit() {

  }
}
