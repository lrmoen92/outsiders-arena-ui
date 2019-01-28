import { Component, Input, } from '@angular/core';
import { Character } from '../model/api-models';

@Component({
  selector: 'nav-root',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent {

  @Input()
  allCharacters : Array<Character>;
}
