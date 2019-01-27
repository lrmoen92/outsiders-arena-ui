import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { FormsModule }   from '@angular/forms';
import { ChatComponent } from './chat.component';

@NgModule({
  declarations: [
    ChatComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [ChatComponent]
})
export class ChatModule { }
