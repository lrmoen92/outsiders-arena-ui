import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'chat-root',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  httpClient : HttpClient;
  
  constructor(httpClient : HttpClient) {
    this.httpClient = httpClient;
  }

  ngOnInit() {

    this.httpClient.get('').subscribe(
      x => {
        console.log(x);
      },
      y => {

      },
      () => {

      }
    );
  }
}
