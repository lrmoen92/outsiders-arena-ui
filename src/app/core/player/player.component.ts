import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Player } from 'src/app/model/api-models';
import { CharacterStore } from 'src/app/utils/character.store';
import { LoginStore } from 'src/app/utils/login.store';
import { MissionStore } from 'src/app/utils/mission.store';

@Component({
  selector: 'player-root',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit, AfterViewInit {

  characterStore: CharacterStore;
  loginStore: LoginStore;
  missionStore: MissionStore;

  player$ : Observable<Player>;
  player: Player;

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
    this.player$ = this.loginStore.getPlayer();
    this.player$.subscribe(player => {
      this.player = player;
    })
  }

  ngAfterViewInit() {
  }
}
