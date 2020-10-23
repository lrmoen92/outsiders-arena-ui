import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Character } from 'src/app/model/api-models';
import { CharacterService } from './character.service';

@Injectable(
  {providedIn:'root'}
) 
export class CharacterStore {

  characterService : CharacterService;

  _allCharacters: BehaviorSubject<Array<Character>> = new BehaviorSubject([]);
  allCharacters: Observable<Array<Character>> = this._allCharacters.asObservable();

  constructor(characterService: CharacterService) {
    this.characterService = characterService;
    this.characterService.initCharacters().subscribe(
      x => {
        this.setCharacters(<Array<Character>> x)
      },
      y => {},
      () => {},
    );
  }

  setCharacters(chars : Array<Character>) {
    this._allCharacters.next(chars);
  }

  getCharacters() : Observable<Array<Character>> {
    return this.allCharacters;
  }
}