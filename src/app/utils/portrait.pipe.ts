import { Pipe, PipeTransform } from '@angular/core';
import { CharacterService } from '../character/character.service';

@Pipe({name: 'findPortrait'})
export class PortraitPipe implements PipeTransform {
    service: CharacterService;
    allCharacters;


    constructor(service : CharacterService) {
        this.service = service;
        // this.allCharacters = this.service.getCharacters();
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