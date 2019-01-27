import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { FormsModule }   from '@angular/forms';
import { ArenaComponent } from './arena.component';


@NgModule({
  declarations: [
    ArenaComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [ArenaComponent]
})
export class AppModule { }
