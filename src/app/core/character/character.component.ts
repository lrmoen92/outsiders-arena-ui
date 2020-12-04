import { Component, OnInit, } from '@angular/core';
import { Observable } from 'rxjs';
import { Character } from 'src/app/model/api-models';
import { CharacterStore } from '../../utils/character.store';

@Component({
  selector: 'character-root',
  templateUrl: './character.component.html',
  styleUrls: ['./character.component.css']
})
export class CharacterComponent implements OnInit {

  allCharacters : Observable<Array<Character>>;
  characterStore : CharacterStore;

	constructor(
    characterStore : CharacterStore
	) {
    this.characterStore = characterStore;
  }
  
  ngOnInit() {
    this.allCharacters = this.characterStore.getCharacters();
  }
}
