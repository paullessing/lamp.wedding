import { Pipe, PipeTransform } from '@angular/core';
import { Guest } from '../../shared/guest.model';

@Pipe({
  name: 'guestName'
})
export class GuestNamePipe implements PipeTransform {
  public transform(guest: Guest): string {
    return `${guest.firstName} ${guest.lastName}`;
  }
}
