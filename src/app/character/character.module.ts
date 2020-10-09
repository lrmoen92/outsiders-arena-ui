import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { FormsModule }   from '@angular/forms';
import { CharacterComponent } from './character.component';
import { CharacterService } from './character.service';

@NgModule({
  declarations: [
    CharacterComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [CharacterComponent]
})
export class CharacterModule { }
