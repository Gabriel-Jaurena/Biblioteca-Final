import { TestBed } from '@angular/core/testing';

import { Saga } from './saga';

describe('Saga', () => {
  let service: Saga;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Saga);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
