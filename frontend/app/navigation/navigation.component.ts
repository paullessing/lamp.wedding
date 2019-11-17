import { AfterViewInit, Component, ElementRef, HostListener, Renderer2, ViewChild } from '@angular/core';
import { Event, NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export interface NavigationItem {
  name?: string;
  location: string;
  icon?: string;
};

export const NAVIGATION_ITEMS: NavigationItem[] = [{
  name: 'RSVP',
  location: '/rsvp'
},{
  name: 'Location',
  location: '/location'
},{
  name: 'Schedule',
  location: '/schedule'
},{
  name: 'Gifts',
  location: '/gifts'
},{
  name: 'Photos',
  location: '/photos'
}];

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements AfterViewInit {

  public items: NavigationItem[] = NAVIGATION_ITEMS;

  public active = 0;

  @ViewChild('navbar')
  public navbar: ElementRef;

  private resizeBouncer: Subject<void>;

  constructor(
    private router: Router,
    private host: ElementRef,
    private renderer: Renderer2
  ) {
    // console.log('Construct nav');
    router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        console.log(event.url);
        this.active = this.items.map(item => item.location).indexOf(event.url);
      }
    });

    this.resizeBouncer = new Subject<void>();
    this.resizeBouncer.pipe(debounceTime(200)).subscribe(() => this.handleWindowResize());
  }

  @HostListener('window:resize')
  public onWindowResize(): void {
    this.resizeBouncer.next();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.handleWindowResize();
    });
  }

  private handleWindowResize(): void {
    const navElt: HTMLElement = this.navbar && this.navbar.nativeElement;
    if (!navElt) {
      return;
    }
    const height = navElt.getBoundingClientRect().height;
    this.renderer.setStyle(this.host.nativeElement, 'height', `${height}px`);
  }
}
