import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchivosDbComponent } from './archivos-db.component';

describe('ArchivosDbComponent', () => {
  let component: ArchivosDbComponent;
  let fixture: ComponentFixture<ArchivosDbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivosDbComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArchivosDbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
