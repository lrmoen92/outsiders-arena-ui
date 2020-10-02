import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {MatTooltipModule} from '@angular/material/tooltip';


import { CountdownModule } from 'ngx-countdown';

import { FormsModule, ReactiveFormsModule }   from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { NavComponent } from './nav/nav.component';
import { ArenaComponent } from './login/arena/arena.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule, Routes } from '@angular/router';
import { CharacterComponent } from './login/character/character.component';
import { MissionComponent } from './login/mission/mission.component';
import { HomeComponent } from './login/home/home.component';
import { CharacterService } from './login/character/character.service';
import { LoginService } from './login/login.service';
import { ArenaService } from './login/arena/arena.service';
import { PortraitPipe } from './utils/portrait.pipe';


const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'arena', component: ArenaComponent },
  { path: 'mission', component: MissionComponent },
  { path: 'character', component: CharacterComponent }
  // { path: '**', component: PageNotFoundComponent },  // Wildcard route for a 404 page
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    NavComponent,
    ArenaComponent,
    PortraitPipe
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
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
