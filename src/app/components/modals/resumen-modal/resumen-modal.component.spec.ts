import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumenModalComponent } from './resumen-modal.component';

describe('ResumenModalComponent', () => {
  let component: ResumenModalComponent;
  let fixture: ComponentFixture<ResumenModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumenModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResumenModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
