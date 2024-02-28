import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CountdownModule } from 'ngx-countdown';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule, Routes } from '@angular/router';
import { PortraitPipe } from './utils/portrait.pipe';
import { AbilityPipe } from './utils/ability.pipe';
import { ArenaComponent } from './core/battle/arena/arena.component';
import { BattleComponent } from './core/battle/battle.component';
import { CharacterComponent } from './core/character/character.component';
import { HomeComponent } from './core/home/home.component';
import { LoginComponent } from './core/login/login.component';
import { MissionComponent } from './core/mission/mission.component';
import { NavComponent } from './core/nav/nav.component';
import { PlayerComponent } from './core/player/player.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'battle', component: BattleComponent },
  { path: 'mission', component: MissionComponent },
  { path: 'character', component: CharacterComponent },
  { path: 'player', component: PlayerComponent },
  { path: '**', component: HomeComponent }  // Wildcard route for a 404 page
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AppComponent,
    BattleComponent,
    ArenaComponent,
    NavComponent,
    CharacterComponent,
    HomeComponent,
    MissionComponent,
    PlayerComponent,
    PortraitPipe,
    AbilityPipe
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    CountdownModule,
    ReactiveFormsModule,
    DragDropModule,
    BrowserAnimationsModule,
    MatTooltipModule,
    FontAwesomeModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
  ],
  bootstrap: [
    AppComponent
  ],
  exports: [RouterModule]
})
export class AppModule { }
