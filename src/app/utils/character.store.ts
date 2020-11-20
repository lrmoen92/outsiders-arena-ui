import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { Character } from 'src/app/model/api-models';
import { CharacterService } from './character.service';

@Injectable(
  {providedIn:'root'}
) 
export class CharacterStore {

  characterService : CharacterService;

  charactersLoaded : boolean = false;

  _allCharacters: BehaviorSubject<Array<Character>> = new BehaviorSubject([]);
  allCharacters: Observable<Array<Character>> = this._allCharacters.asObservable();

  constructor(characterService: CharacterService) {
    this.characterService = characterService;
  }

  setCharactersLoaded(b : boolean) {
    this.charactersLoaded = b;
  }

  setCharacters(chars : Array<Character>) {
    this._allCharacters.next(chars);
  }

  initCharacters() {
    this.characterService.initCharacters().pipe(take(1)).subscribe(
      x => {
        this.setCharacters(<Array<Character>> x);
      },
      y => {

      },
      () => {
        this.setCharactersLoaded(true);
      }
    );
  }

  getCharacters() : Observable<Array<Character>> {

    if (!this.charactersLoaded) {
      this.initCharacters();
    }

    return this.allCharacters;
  }
}