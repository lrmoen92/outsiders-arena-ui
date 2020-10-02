import { Component, Input, } from '@angular/core';
import { Character } from 'src/app/model/api-models';

@Component({
  selector: 'mission-root',
  templateUrl: './mission.component.html',
  styleUrls: ['./mission.component.css']
})
export class MissionComponent {

  allCharacters : Array<Character>;

  
}
