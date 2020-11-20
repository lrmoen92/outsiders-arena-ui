import { Component, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { CharacterStore } from 'src/app/utils/character.store';

@Component({
  selector: 'home-root',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  characterStore: CharacterStore;

  constructor(characterStore : CharacterStore) {
    this.characterStore = characterStore;
  }
  
  ngOnInit() {
    this.characterStore.initCharacters();
  }
}
