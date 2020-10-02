import { Pipe, PipeTransform } from '@angular/core';
import { CharacterService } from '../login/character/character.service';
import { Character } from '../model/api-models';

@Pipe({name: 'findPortrait'})
export class PortraitPipe implements PipeTransform {
    service: CharacterService;
    allCharacters;


    constructor(service : CharacterService) {
        this.service = service;
        this.allCharacters = this.service.getAllCharacters();
    }

  transform(value: number): string {
    for(let c of this.allCharacters) {
        console.log(c);
        if (c.id === value) {
            return c.avatarUrl;
        }
    }
    return "";
  }
}