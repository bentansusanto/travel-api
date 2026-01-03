import Hashids from 'hashids';
import { State } from 'src/modules/country/entities/state.entity';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryDestination } from './category_destination.entity';
import { DestinationTranslation } from './destination-translation.entity';
import { BookTourItems } from 'src/modules/book-tours/entities/book-tour-items.entity';

@Entity('destinations')
export class Destination {
  @PrimaryColumn()
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = new Hashids(process.env.ID_SECRET, 10).encode(Date.now());
    }
  }

  @ManyToOne(
    () => CategoryDestination,
    (categoryDestination) => categoryDestination.destinations,
  )
  @JoinColumn({ name: 'category_destination_id' })
  category_destination: CategoryDestination;

  @ManyToOne(() => State, (state) => state.destinations)
  @JoinColumn({ name: 'state_id' })
  state: State;

  @OneToMany(
    () => DestinationTranslation,
    (destinationTranslation) => destinationTranslation.destination,
  )
  translations: DestinationTranslation[];

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  price: number;

  @OneToMany(
    () => BookTourItems,
    (bookTourItems) => bookTourItems.destination,
  )
  book_tour_items: BookTourItems[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deletedAt: Date;
}
