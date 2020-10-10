import { Pipe, PipeTransform } from '@angular/core';
import { CharacterService } from '../character/character.service';
import { CharacterStore } from '../character/character.store';

@Pipe({name: 'findPortrait'})
export class PortraitPipe implements PipeTransform {
    store :CharacterStore;
    allCharacters;


    constructor(store: CharacterStore) {
        this.store = store;
        this.allCharacters = store.getCharacters();
    }

    transform(){
      
    }
}