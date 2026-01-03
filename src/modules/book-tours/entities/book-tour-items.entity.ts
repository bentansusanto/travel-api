import Hashids from 'hashids';
import { Destination } from 'src/modules/destination/entities/destination.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { BookTour } from './book-tour.entity';

@Entity('book_tour_items')
export class BookTourItems {
  @PrimaryColumn()
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = new Hashids(process.env.ID_SECRET, 10).encode(Date.now());
    }
  }

  @ManyToOne(() => BookTour, (bookTour) => bookTour.book_tour_items)
  @JoinColumn({ name: 'book_tour_id' })
  book_tour: BookTour;

  @ManyToOne(() => Destination, (destination) => destination.book_tour_items)
  @JoinColumn({ name: 'destination_id' })
  destination: Destination;

  @Column({
    type: 'date',
  })
  visit_date: Date;

  @Column()
  created_at: Date;

  @Column()
  updated_at: Date;

  @Column({
    nullable: true,
  })
  deleted_at: Date;
}
