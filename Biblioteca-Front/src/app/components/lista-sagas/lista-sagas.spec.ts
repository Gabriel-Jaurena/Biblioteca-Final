import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaSagas } from './lista-sagas';

describe('ListaSagas', () => {
  let component: ListaSagas;
  let fixture: ComponentFixture<ListaSagas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaSagas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaSagas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
