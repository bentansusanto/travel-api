import Hashids from 'hashids';
import { Country } from 'src/modules/country/entities/country.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { BookTourItems } from './book-tour-items.entity';
import { Tourist } from 'src/modules/tourists/entities/tourist.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';

export enum StatusBookTour {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity()
export class BookTour {
  @PrimaryColumn()
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = new Hashids(process.env.ID_SECRET, 10).encode(Date.now());
    }
  }

  @ManyToOne(() => User, (user) => user.book_tours)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Country, (country) => country.book_tours)
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @OneToMany(() => BookTourItems, (bookTourItems) => bookTourItems.book_tour)
  book_tour_items: BookTourItems[];

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  subtotal: number;

  @Column({
    type: 'enum',
    enum: StatusBookTour,
    default: StatusBookTour.DRAFT,
  })
  status: StatusBookTour;

  @OneToMany(() => Tourist, (tourist) => tourist.bookTour)
  tourists: Tourist[];

  @OneToMany(() => Payment, (payment) => payment.bookTour)
  payments: Payment[];

  @Column()
  created_at: Date;

  @Column()
  updated_at: Date;

  @Column({
    nullable: true,
  })
  deleted_at: Date;
}
