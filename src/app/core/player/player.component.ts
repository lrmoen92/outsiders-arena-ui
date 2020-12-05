import { Component, OnInit } from '@angular/core';
import { Player } from 'src/app/model/api-models';
import { CharacterStore } from 'src/app/utils/character.store';
import { LoginStore } from 'src/app/utils/login.store';
import { MissionStore } from 'src/app/utils/mission.store';

@Component({
  selector: 'player-root',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {

  characterStore: CharacterStore;
  loginStore: LoginStore;
  missionStore: MissionStore;

  player : Player;

  constructor(
    characterStore : CharacterStore,
    loginStore : LoginStore,
    missionStore : MissionStore
	) {
    this.characterStore = characterStore;
    this.loginStore = loginStore;
    this.missionStore = missionStore;
  }
  
  ngOnInit() {

    this.loginStore.getPlayer().subscribe(p => {
      if (p) {
        this.player = p;
      }
    });
    
  }
}
