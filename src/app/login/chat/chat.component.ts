import { Component, Input } from '@angular/core';
import { Player } from 'src/app/model/api-models';

@Component({
  selector: 'chat-root',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {

  @Input()
  player : Player;
}
