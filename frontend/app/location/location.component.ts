import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss']
})
export class LocationComponent implements AfterViewInit {

  constructor(
    private route: ActivatedRoute
  ) {}

  public ngAfterViewInit(): void {
    if (this.route.snapshot.fragment === 'transport') {
      document.getElementById('transport-title').scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }

}
