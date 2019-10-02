use super::{AbstractMut, IntoAbstract};
use crate::entity::Key;
#[cfg(feature = "parallel")]
use rayon::iter::plumbing::Producer;

macro_rules! impl_iterators {
    (
        $number: literal
        $loose: ident
        $(($type: ident, $index: tt))+
    ) => {
        #[doc = "Loose packed iterator over"]
        #[doc = $number]
        #[doc = "components.\n"]
        pub struct $loose<$($type: IntoAbstract),+> {
            pub(super) data: ($($type::AbsView,)+),
            pub(super) indices: *const Key,
            pub(super) current: usize,
            pub(super) end: usize,
            pub(super) array: u32,
        }

        unsafe impl<$($type: IntoAbstract),+> Send for $loose<$($type),+> {}

        impl<$($type: IntoAbstract),+> Iterator for $loose<$($type,)+> {
            type Item = ($(<$type::AbsView as AbstractMut>::Out,)+);
            fn next(&mut self) -> Option<Self::Item> {
                if self.current < self.end {
                    // SAFE at this point there are no mutable reference to sparse or dense
                    // and self.indices can't access out of bounds
                    let index = unsafe { std::ptr::read(self.indices.add(self.current)) };
                    self.current += 1;
                    let indices = ($(
                        if (self.array >> $index) & 1 != 0 {
                            self.current - 1
                        } else {
                            unsafe { self.data.$index.index_of_unchecked(index) }
                        },
                    )+);
                    Some(($({
                        unsafe { self.data.$index.get_data(indices.$index) }
                    },)+))
                } else {
                    None
                }
            }
            fn size_hint(&self) -> (usize, Option<usize>) {
                (self.len(), Some(self.len()))
            }
        }

        impl<$($type: IntoAbstract),+> DoubleEndedIterator for $loose<$($type,)+> {
            fn next_back(&mut self) -> Option<Self::Item> {
                if self.end > self.current {
                    self.end -= 1;
                    // SAFE at this point there are no mutable reference to sparse or dense
                    // and self.indices can't access out of bounds
                    let index = unsafe { std::ptr::read(self.indices.add(self.end)) };
                    let indices = ($(
                        if (self.array >> $index) & 1 != 0 {
                            self.end
                        } else {
                            unsafe { self.data.$index.index_of_unchecked(index) }
                        },
                    )+);
                    Some(($({
                        unsafe { self.data.$index.get_data(indices.$index) }
                    },)+))
                } else {
                    None
                }
            }
        }

        impl<$($type: IntoAbstract),+> ExactSizeIterator for $loose<$($type),+> {
            fn len(&self) -> usize {
                self.end - self.current
            }
        }

        #[cfg(feature = "parallel")]
        impl<$($type: IntoAbstract),+> Producer for $loose<$($type),+>
        where
            $(<$type::AbsView as AbstractMut>::Out: Send),+
        {
            type Item = ($(<$type::AbsView as AbstractMut>::Out,)+);
            type IntoIter = Self;
            fn into_iter(self) -> Self::IntoIter {
                self
            }
            fn split_at(mut self, index: usize) -> (Self, Self) {
                let clone = $loose {
                    data: self.data.clone(),
                    indices: self.indices,
                    current: self.current + index,
                    end: self.end,
                    array: self.array,
                };
                self.end = clone.current;
                (self, clone)
            }
        }
    }
}

macro_rules! iterators {
    (
        $($number: literal)*; $number1: literal $($queue_number: literal)+;
        $($loose: ident)*; $loose1: ident $($queue_loose: ident)+;
        $(($type: ident, $index: tt))*;($type1: ident, $index1: tt) $(($queue_type: ident, $queue_index: tt))*
    ) => {
        impl_iterators![$number1 $loose1 $(($type, $index))*];
        iterators![
            $($number)* $number1; $($queue_number)+;
            $($loose)* $loose1; $($queue_loose)+;
            $(($type, $index))* ($type1, $index1); $(($queue_type, $queue_index))*
        ];
    };
    (
        $($number: literal)*; $number1: literal;
        $($loose: ident)*; $loose1: ident;
        $(($type: ident, $index: tt))*;
    ) => {
        impl_iterators![$number1 $loose1 $(($type, $index))*];
    }
}

iterators![
    ;"2" "3" "4" "5" "6" "7" "8" "9" "10";
    ;Loose2 Loose3 Loose4 Loose5 Loose6 Loose7 Loose8 Loose9 Loose10;
    (A, 0) (B, 1); (C, 2) (D, 3) (E, 4) (F, 5) (G, 6) (H, 7) (I, 8) (J, 9)
];
