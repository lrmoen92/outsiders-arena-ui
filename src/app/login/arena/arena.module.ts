import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { FormsModule }   from '@angular/forms';

import { CountdownModule } from 'ngx-countdown';
import { ArenaComponent } from './arena.component';


@NgModule({
  declarations: [
    ArenaComponent
  ],
  imports: [
    BrowserModule,
    CountdownModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [ArenaComponent]
})
export class ArenaModule { }
