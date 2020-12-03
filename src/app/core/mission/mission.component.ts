import { Component, Input, OnInit, } from '@angular/core';
import { Character, Mission } from 'src/app/model/api-models';

@Component({
  selector: 'mission-root',
  templateUrl: './mission.component.html',
  styleUrls: ['./mission.component.css']
})
export class MissionComponent implements OnInit {

  allCharacters : Array<Character>;

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
