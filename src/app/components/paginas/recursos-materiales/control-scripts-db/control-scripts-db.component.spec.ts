import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlScriptsDbComponent } from './control-scripts-db.component';

describe('ControlScriptsDbComponent', () => {
  let component: ControlScriptsDbComponent;
  let fixture: ComponentFixture<ControlScriptsDbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlScriptsDbComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ControlScriptsDbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
