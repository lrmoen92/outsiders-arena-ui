import { Pipe, PipeTransform } from '@angular/core';
import { ArenaService } from '../arena/arena.service';
import { Ability } from '../model/api-models';

@Pipe({name: 'abilityPipe'})
export class AbilityPipe implements PipeTransform {
    arenaService: ArenaService;

    constructor(arenaService : ArenaService) {
        this.arenaService = arenaService;
    }

  transform(ability: Ability) {
    return this.getAbilityStyle(ability);
  }

  getAbilityStyle(ability) {
		if (this.arenaService.isAbilityLocked(ability)) {
			return {'opacity': 0.2};
		} else {
			return {'opacity': 1};
		}
  }

}