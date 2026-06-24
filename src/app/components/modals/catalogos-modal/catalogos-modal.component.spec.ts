import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogosModalComponent } from './catalogos-modal.component';

describe('CatalogosModalComponent', () => {
  let component: CatalogosModalComponent;
  let fixture: ComponentFixture<CatalogosModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogosModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CatalogosModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
