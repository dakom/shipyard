use crate::entity::Key;

/// Immutable view into a `ComponentStorage`.
pub struct View<'a, T> {
    pub(crate) sparse: &'a [usize],
    pub(crate) dense: &'a [usize],
    pub(crate) data: &'a [T],
}

impl<T> View<'_, T> {
    /// Returns true if the `entity` has this component.
    fn contains(&self, entity: Key) -> bool {
        self.contains_index(entity.index())
    }
    pub(crate) fn contains_index(&self, index: usize) -> bool {
        index < self.sparse.len()
            && unsafe { *self.sparse.get_unchecked(index) } < self.dense.len()
            && unsafe { *self.dense.get_unchecked(*self.sparse.get_unchecked(index)) == index }
    }
    /// Returns a reference to the component if the `entity` has it.
    pub fn get(&self, entity: Key) -> Option<&T> {
        if self.contains(entity) {
            Some(unsafe {
                self.data
                    .get_unchecked(*self.sparse.get_unchecked(entity.index()))
            })
        } else {
            None
        }
    }
    /// Returns the number of components in the view.
    pub fn len(&self) -> usize {
        self.dense.len()
    }
}

/// Mutable view into a `ComponentStorage`.
pub struct ViewMut<'a, T> {
    pub(crate) sparse: &'a mut Vec<usize>,
    pub(crate) dense: &'a mut Vec<usize>,
    pub(crate) data: &'a mut Vec<T>,
}

impl<'a, T> ViewMut<'a, T> {
    /// Add the component to the `entity`.
    pub(crate) fn insert(&mut self, entity: Key, mut value: T) -> Option<T> {
        let index = entity.index();
        if index >= self.sparse.len() {
            self.sparse.resize(index + 1, 0);
        }
        if let Some(data) = self.get_mut(entity) {
            std::mem::swap(data, &mut value);
            Some(value)
        } else {
            unsafe { *self.sparse.get_unchecked_mut(index) = self.dense.len() };
            self.dense.push(index);
            self.data.push(value);
            None
        }
    }
    /// Returns true if the `entity` has this component.
    fn contains(&self, entity: Key) -> bool {
        self.contains_index(entity.index())
    }
    pub(crate) fn contains_index(&self, index: usize) -> bool {
        index < self.sparse.len()
            && unsafe { *self.sparse.get_unchecked(index) } < self.dense.len()
            && unsafe { *self.dense.get_unchecked(*self.sparse.get_unchecked(index)) == index }
    }
    /// Returns a reference to the component if the `entity` has it.
    pub(crate) fn get(&self, entity: Key) -> Option<&T> {
        if self.contains(entity) {
            Some(unsafe {
                self.data
                    .get_unchecked(*self.sparse.get_unchecked(entity.index()))
            })
        } else {
            None
        }
    }
    /// Returns a mutable reference to the component if the `entity` has it.
    pub(crate) fn get_mut(&mut self, entity: Key) -> Option<&mut T> {
        if self.contains(entity) {
            Some(unsafe {
                self.data
                    .get_unchecked_mut(*self.sparse.get_unchecked(entity.index()))
            })
        } else {
            None
        }
    }
    /// Remove the component if the `entity` has it and returns it.
    pub(crate) fn remove(&mut self, entity: Key) -> Option<T> {
        if self.contains(entity) {
            let dense_index = unsafe { *self.sparse.get_unchecked(entity.index()) };
            unsafe {
                *self
                    .sparse
                    .get_unchecked_mut(*self.dense.get_unchecked(self.dense.len() - 1)) =
                    dense_index
            };
            self.dense.swap_remove(dense_index);
            Some(self.data.swap_remove(dense_index))
        } else {
            None
        }
    }
    /// Returns the number of components in the view.
    pub fn len(&self) -> usize {
        self.dense.len()
    }
    /// Consumes the ViewMut and returns a ViewSemiMut.
    pub(crate) fn into_semi_mut(self) -> ViewSemiMut<'a, T> {
        ViewSemiMut {
            sparse: self.sparse,
            dense: self.dense,
            data: self.data,
        }
    }
    /// Borrows the ViewMut and returns a ViewSemiMut.
    pub(crate) fn semi_mut(&mut self) -> ViewSemiMut<T> {
        ViewSemiMut {
            sparse: self.sparse,
            dense: self.dense,
            data: self.data,
        }
    }
    /// Borrows the ViewMut and returns a View.
    pub(crate) fn non_mut(&self) -> View<T> {
        View {
            sparse: self.sparse,
            dense: self.dense,
            data: self.data,
        }
    }
}

// Used in iterators to be able to keep a pointer to the indices
pub struct ViewSemiMut<'a, T> {
    pub(crate) sparse: &'a [usize],
    pub(crate) dense: &'a [usize],
    pub(crate) data: &'a mut [T],
}

impl<'a, T> ViewSemiMut<'a, T> {
    /// Returns true if the `entity` has this component.
    fn contains(&self, entity: Key) -> bool {
        self.contains_index(entity.index())
    }
    pub(crate) fn contains_index(&self, index: usize) -> bool {
        index < self.sparse.len()
            && unsafe { *self.sparse.get_unchecked(index) } < self.dense.len()
            && unsafe { *self.dense.get_unchecked(*self.sparse.get_unchecked(index)) == index }
    }
    /// Returns a reference to the component if the `entity` has it.
    pub(crate) fn get(&self, entity: Key) -> Option<&T> {
        if self.contains(entity) {
            Some(unsafe {
                self.data
                    .get_unchecked(*self.sparse.get_unchecked(entity.index()))
            })
        } else {
            None
        }
    }
    /// Returns a mutable reference to the component if the `entity` has it.
    pub(crate) fn get_mut(&mut self, entity: Key) -> Option<&mut T> {
        if self.contains(entity) {
            Some(unsafe {
                self.data
                    .get_unchecked_mut(*self.sparse.get_unchecked(entity.index()))
            })
        } else {
            None
        }
    }
    /// Returns the number of components in the view.
    pub fn len(&self) -> usize {
        self.dense.len()
    }
}
