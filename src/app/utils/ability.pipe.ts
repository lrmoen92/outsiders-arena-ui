import { Pipe, PipeTransform } from '@angular/core';
import { Ability } from '../model/api-models';
import { ArenaService } from './arena.service';

@Pipe({name: 'abilityPipe'})
export class AbilityPipe implements PipeTransform {
    arenaService: ArenaService;

    constructor(arenaService : ArenaService) {
        this.arenaService = arenaService;
    }

  transform(ability: Ability) {

  }

}