import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CharacterService } from './character/character.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  httpClient : HttpClient;
  characterService : CharacterService;
	
	title : string = 'outsiders-arena-ui';

  constructor(httpClient : HttpClient, characterService: CharacterService) {
    this.httpClient = httpClient;
    this.characterService = characterService;
  }

  ngOnInit() {
    
  }

}
