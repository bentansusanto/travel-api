import Hashids from 'hashids';
import { BookMotor } from 'src/modules/book-motors/entities/book-motor.entity';
import { BookTour } from 'src/modules/book-tours/entities/book-tour.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

export enum Gender {
  MR = 'Mr',
  MISS = 'Miss',
  MRS = 'Mrs',
}

@Entity('tourists')
export class Tourist {
  @PrimaryColumn()
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = new Hashids(process.env.ID_SECRET, 10).encode(
        Date.now(),
        Math.floor(Math.random() * 10000),
      );
    }
  }

  @ManyToOne(() => BookTour, (bookTour) => bookTour.tourists)
  @JoinColumn({ name: 'book_tour_id' })
  bookTour: BookTour;

  @ManyToOne(() => BookMotor, (bookMotor) => bookMotor.tourists)
  @JoinColumn({ name: 'book_motor_id' })
  book_motor: BookMotor;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender: Gender;

  @Column({
    nullable: true,
  })
  phone_number?: string;

  @Column()
  nationality: string;

  @Column()
  passport_number: string;

  @Column()
  created_at: Date;

  @Column()
  updated_at: Date;

  @Column({
    nullable: true,
  })
  deleted_at: Date;
}
