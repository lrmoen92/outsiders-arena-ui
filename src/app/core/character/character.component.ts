import { Component, OnInit, } from '@angular/core';
import { Observable } from 'rxjs';
import { Ability, Character } from 'src/app/model/api-models';
import { serverPrefix } from 'src/app/utils/constants';
import { CharacterStore } from '../../utils/character.store';

@Component({
  selector: 'character-root',
  templateUrl: './character.component.html',
  styleUrls: ['./character.component.css']
})
export class CharacterComponent implements OnInit {

  allCharacters : Observable<Array<Character>>;
  characterStore : CharacterStore;

  selectedCharacter : Character;
  selectedAbility : Ability;


	imgPrefix : string = serverPrefix;

	constructor(
    characterStore : CharacterStore
	) {
    this.characterStore = characterStore;
  }
  
  ngOnInit() {
    this.allCharacters = this.characterStore.getCharacters();
  }

  showCharacterInfo(character : Character) {
    this.selectedCharacter = character;
  }
  
  showAbilityInfo(ability : Ability) {
    this.selectedAbility = ability;
  }

  back() {
    if (this.selectedAbility) {
      this.selectedAbility = null;
    } else if (this.selectedCharacter) {
      this.selectedCharacter = null;
    }
  }
}
