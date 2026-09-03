import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleSaga } from './detalle-saga';

describe('DetalleSaga', () => {
  let component: DetalleSaga;
  let fixture: ComponentFixture<DetalleSaga>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleSaga]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleSaga);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
