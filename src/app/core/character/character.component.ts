import { HttpClient } from '@angular/common/http';
import { Component, OnInit, } from '@angular/core';
import { take } from 'rxjs/operators';
import { Character } from 'src/app/model/api-models';
import { CharacterStore } from '../../utils/character.store';
import { LoginStore } from '../../utils/login.store';

@Component({
  selector: 'character-root',
  templateUrl: './character.component.html',
  styleUrls: ['./character.component.css']
})
export class CharacterComponent implements OnInit {

  allCharacters : Array<Character>;

  httpClient: HttpClient; 
  characterStore : CharacterStore;
  loginStore : LoginStore;

	constructor(
		httpClient : HttpClient, 
    characterStore : CharacterStore,
    loginStore : LoginStore
	) {
    this.httpClient = httpClient;
    this.characterStore = characterStore;
    this.loginStore = loginStore;
  }
  
  ngOnInit() {
    this.characterStore.getCharacters().pipe(take(1)).subscribe(x => {
      this.allCharacters = x;
    })
  }
}
